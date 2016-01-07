require 'rubygems'
require 'rack_dav'

use Rack::CommonLogger
run RackDAV::Handler.new(:root => File.expand_path('..', __FILE__))
